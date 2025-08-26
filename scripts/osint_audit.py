import dns.resolver
import ssl
import socket
import requests
import json
import threading
import itertools
import subprocess
import tempfile
import shutil
import queue
import argparse
import os
import sys
import concurrent.futures

from tqdm import tqdm
from colorama import init, Fore, Style

# Initialize colorama for colorized output
init(autoreset=True)

# Global caches for wordlist and fuzzed patterns
_wordlist_cache = {}
_fuzz_pattern_cache = {}

def color_log(message, color=Fore.WHITE, verbose=False, force=False):
    if (sys.stdout.isatty() or force) and message:
        if verbose:
            print(color + message + Style.RESET_ALL)
        elif force:
            print(color + message + Style.RESET_ALL)
    elif message and (verbose or force):
        print(message)

##########################
# DNS, SSL, Leak, Dossiers
##########################

def get_dns_info(domain, verbose=False):
    dns_records = {}
    record_types = ['A', 'MX', 'NS', 'TXT', 'CNAME']
    for record in record_types:
        try:
            color_log(f"Resolving {record} records for {domain}...", Fore.CYAN, verbose)
            answers = dns.resolver.resolve(domain, record)
            dns_records[record] = [str(r) for r in answers]
        except Exception as e:
            dns_records[record] = f'Error fetching {record}: {e}'
    return dns_records

def check_ssl_certificate(domain, verbose=False):
    ssl_info = {}
    ctx = ssl.create_default_context()
    try:
        color_log(f"Fetching SSL certificate for {domain}...", Fore.CYAN, verbose)
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(5)
            s.connect((domain, 443))
            cert = s.getpeercert()
            ssl_info = {
                'subject': cert.get('subject'),
                'issuer': cert.get('issuer'),
                'valid_from': cert.get('notBefore'),
                'valid_to': cert.get('notAfter'),
                'subjectAltName': cert.get('subjectAltName')
            }
    except Exception as e:
        ssl_info['error'] = str(e)
    return ssl_info

def search_leaks(domain, hibp_api_key=None, verbose=False):
    leaks_info = {}
    try:
        color_log(f"Searching DuckDuckGo for breach data on {domain}...", Fore.YELLOW, verbose)
        query = f'"{domain}" data breach'
        resp = requests.get(f'https://api.duckduckgo.com/?q={query}&format=json')
        leaks_info['duckduckgo'] = resp.json()
    except Exception as e:
        leaks_info['duckduckgo_error'] = str(e)

    if hibp_api_key:
        headers = {'hibp-api-key': hibp_api_key}
        url = f"https://haveibeenpwned.com/api/v3/breaches?domain={domain}"
        try:
            color_log(f"Querying HaveIBeenPwned API for {domain}...", Fore.YELLOW, verbose)
            resp = requests.get(url, headers=headers)
            if resp.status_code == 200:
                leaks_info['hibp'] = resp.json()
            else:
                leaks_info['hibp'] = f"Error or no breaches found: HTTP {resp.status_code}"
        except Exception as e:
            leaks_info['hibp_error'] = str(e)
    else:
        leaks_info['hibp'] = "No HIBP API key provided"
    return leaks_info

def get_social_dossiers(domain, verbose=False, hunter_api_key=None):
    dossiers = {}
    if not hunter_api_key:
        dossiers['error'] = "No Hunter.io API key provided"
        return dossiers
    try:
        color_log(f"Fetching social dossiers for {domain} via Hunter.io...", Fore.YELLOW, verbose)
        resp = requests.get(
            f'https://api.hunter.io/v2/domain-search?domain={domain}&api_key={hunter_api_key}'
        )
        emails = resp.json().get('data', {}).get('emails', [])
        for person in emails:
            full_name = (person.get('first_name', '') + ' ' + person.get('last_name', '')).strip()
            dossiers[full_name] = {
                'email': person.get('value'),
                'position': person.get('position'),
                'linkedin_search_url': f'https://www.linkedin.com/search/results/all/?keywords={full_name}'
            }
    except Exception as e:
        dossiers['error'] = str(e)
    return dossiers

##############################
# Subdomain discovery/fuzzing
##############################

def load_wordlist(wordlist_path, verbose=False):
    if wordlist_path in _wordlist_cache:
        return _wordlist_cache[wordlist_path]
    if verbose:
        color_log(f"Loading wordlist from {wordlist_path}...", Fore.BLUE, verbose)
    try:
        with open(wordlist_path, 'r') as wl:
            words = [line.strip() for line in wl if line.strip()]
        _wordlist_cache[wordlist_path] = words
        return words
    except Exception as e:
        raise Exception(f"Unable to read wordlist at {wordlist_path}: {e}")

def fuzz_subdomain_patterns(base, fuzz_words, max_combo_words=100):
    patterns = set()

    def single_word_variants(word):
        yield word
        yield word + "1"
        yield word + "01"
        yield "dev-" + word
        yield "test-" + word
        yield word + "-test"
        yield word + "-dev"
        yield word.replace("-", "")
        for i in range(2, 5):
            yield f"{word}{i}"
        for prefix in ['dev', 'test', 'prod', 'stage', 'staging', 'admin', 'vpn', 'mail']:
            yield f"{prefix}-{word}"
        for suffix in ['dev', 'test', 'prod', 'stage', 'staging', 'admin']:
            yield f"{word}-{suffix}"
        for year in ['2022', '2023', '2024', '2025']:
            yield f"{word}{year}"

    limited_words = fuzz_words[:max_combo_words] if len(fuzz_words) > max_combo_words else fuzz_words

    for word in (w.strip() for w in fuzz_words if w.strip()):
        patterns.update(single_word_variants(word))

    pairs = ((f"{a}-{b}", f"{b}-{a}") for a, b in itertools.combinations(limited_words, 2))
    for combo_a, combo_b in pairs:
        patterns.add(combo_a)
        patterns.add(combo_b)

    return list(patterns)

def get_fuzz_patterns(domain, wordlist_path, verbose=False):
    key = (domain, wordlist_path)
    if key in _fuzz_pattern_cache:
        return _fuzz_pattern_cache[key]
    words = load_wordlist(wordlist_path, verbose=verbose)
    patterns = fuzz_subdomain_patterns(domain, words)
    _fuzz_pattern_cache[key] = patterns
    if verbose:
        color_log(f"Cached {len(patterns)} fuzz patterns for {domain} and {wordlist_path}.", Fore.BLUE, True)
    return patterns

def discover_subdomains(domain, wordlist_path, max_threads=10, verbose=False):
    discovered = []
    checked = set()
    fuzzed = get_fuzz_patterns(domain, wordlist_path, verbose=verbose)
    if verbose:
        color_log(f"Starting subdomain discovery with {len(fuzzed)} candidates...", Fore.CYAN, verbose)
        iterable = fuzzed
    else:
        color_log("Discovering subdomains...", Fore.CYAN)
        iterable = tqdm(fuzzed, desc="Subdomains", ncols=70)

    def check_subdomain(sub):
        subdomain = f"{sub}.{domain}"
        if subdomain in checked:
            return
        checked.add(subdomain)
        if verbose:
            color_log(f"Trying subdomain: {subdomain}", Fore.LIGHTBLACK_EX, verbose)
        try:
            dns.resolver.resolve(subdomain, 'A')
            color_log(f"Found valid subdomain: {subdomain}", Fore.GREEN, verbose)
            discovered.append(subdomain)
        except Exception:
            pass

    threads = []
    for sub in iterable:
        t = threading.Thread(target=check_subdomain, args=(sub,))
        threads.append(t)
        t.start()
        if len(threads) >= max_threads:
            for tt in threads:
                tt.join()
            threads = []
    for tt in threads:
        tt.join()
    color_log(f"Subdomain discovery complete: {len(discovered)} found", Fore.CYAN, verbose)
    return discovered

#########################
# Concurrent Public S3 bucket search
#########################

def check_s3_bucket_single(bucket, verbose=False):
    result = {}
    url_patterns = [
        f"https://{bucket}.s3.amazonaws.com",
        f"https://s3.amazonaws.com/{bucket}",
        f"https://{bucket}.s3.us-east-1.amazonaws.com",
    ]
    for url in url_patterns:
        try:
            if verbose:
                color_log(f"Checking S3 bucket URL: {url}", Fore.LIGHTBLACK_EX, verbose)
            r = requests.get(url, timeout=5)
            if "AccessDenied" not in r.text and r.status_code == 200:
                return {url: "Publicly accessible"}
            elif r.status_code == 403:
                return {url: "Exists, access denied"}
            elif r.status_code == 404:
                continue
        except Exception as e:
            continue
    return {}

def discover_public_s3_buckets_concurrent(domain, wordlist_path, verbose=False, max_workers=20):
    fuzzed = get_fuzz_patterns(domain, wordlist_path, verbose=verbose)
    candidates = fuzzed + [domain.replace('.', '-'), domain.replace('.', '')]
    color_log(f"Starting concurrent S3 bucket discovery on {len(candidates)} candidates...", Fore.BLUE, verbose)
    found_buckets = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_bucket = {executor.submit(check_s3_bucket_single, cand, verbose): cand for cand in candidates}
        for future in tqdm(concurrent.futures.as_completed(future_to_bucket), total=len(candidates), desc="S3 Buckets", ncols=70, disable=verbose):
            try:
                result = future.result()
                for url, status in result.items():
                    if status == "Publicly accessible":
                        color_log(f"Found public S3 bucket: {url}", Fore.GREEN, verbose)
                        found_buckets[url] = status
            except Exception:
                pass  # Ignore individual errors

    color_log(f"S3 bucket discovery complete: found {len(found_buckets)} public buckets", Fore.BLUE, verbose)
    return found_buckets

#########################
# GitHub repo search
#########################

def search_github_repos(domain, github_token=None, max_results=10, verbose=False):
    headers = {}
    if github_token:
        headers['Authorization'] = f'token {github_token}'
    query = f'{domain} in:name,description,topics'
    url = 'https://api.github.com/search/repositories'
    params = {
        'q': query,
        'sort': 'updated',
        'order': 'desc',
        'per_page': max_results
    }
    try:
        color_log(f"Searching GitHub repositories for domain: {domain}", Fore.MAGENTA, verbose)
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        repos = []
        for item in data.get('items', []):
            repos.append({
                'name': item.get('full_name'),
                'description': item.get('description'),
                'url': item.get('html_url'),
                'stars': item.get('stargazers_count'),
                'forks': item.get('forks_count'),
                'last_updated': item.get('updated_at')
            })
        color_log(f"Found {len(repos)} GitHub repositories", Fore.MAGENTA, verbose)
        return repos
    except Exception as e:
        return {'error': str(e)}

##################################
# Multithreaded GitHub secret scan
##################################

def worker_scan(queue, results_list, print_lock, verbose=False):
    while True:
        repo_url = queue.get()
        if repo_url is None:
            break
        if verbose:
            with print_lock:
                color_log(f"Starting scan of repository: {repo_url}", Fore.CYAN, verbose)
        res = scan_repo_for_secrets(repo_url, verbose)
        with print_lock:
            results_list.append(res)
        queue.task_done()

def scan_repo_for_secrets(repo_url, verbose=False):
    import json
    temp_dir = tempfile.mkdtemp(prefix="osint_repo_")
    results = {}

    try:
        color_log(f"Cloning repository: {repo_url}", Fore.CYAN, verbose)
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, temp_dir],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        color_log(f"Running trufflehog secret scan on {repo_url} ...", Fore.CYAN, verbose)
        proc = subprocess.run(
            ["trufflehog", "filesystem", "--json", temp_dir],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        secrets = []
        for line in proc.stdout.splitlines():
            try:
                secret = json.loads(line)
                secrets.append(secret)
            except Exception:
                continue
        results['repo'] = repo_url
        results['secrets_found'] = secrets
    except subprocess.CalledProcessError as e:
        results['error'] = f"Failed to scan repo: {e}"
    except Exception as e:
        results['error'] = str(e)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
    return results

def multithreaded_secret_scan(repos, max_threads=4, verbose=False):
    q = queue.Queue()
    results = []
    lock = threading.Lock()

    threads = []
    for _ in range(max_threads):
        t = threading.Thread(target=worker_scan, args=(q, results, lock, verbose))
        t.daemon = True
        t.start()
        threads.append(t)

    for repo in repos:
        url = repo.get('url')
        if url:
            q.put(url)

    q.join()

    for _ in range(max_threads):
        q.put(None)
    for t in threads:
        t.join()

    return results

#########################
# Pastebin search module
#########################

def search_pastebin(domain, verbose=False):
    found = []
    try:
        url = f'https://pastebin.com/search?q={domain}'
        headers = {'User-Agent': 'Mozilla/5.0'}
        color_log(f"Searching Pastebin for {domain}...", Fore.YELLOW, verbose)
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, 'html.parser')
            paste_links = soup.select('a[class="i_p0"]')
            for a in paste_links:
                href = a.get('href')
                if href and domain in a.text:
                    found.append(f"https://pastebin.com{href}")
            color_log(f"Pastebin search found {len(found)} items", Fore.YELLOW, verbose)
        else:
            color_log(f"Pastebin search returned HTTP {resp.status_code}", Fore.YELLOW, verbose)
    except Exception as e:
        return {'error': str(e)}
    return found

#########################
# Results saving function
#########################

def save_results_to_json(results, filename="osint_audit_results.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    color_log(f"\nResults saved to {filename}", Fore.GREEN, force=True)

#########################
# Load config from JSON file
#########################

def load_config_from_file(config_path):
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        return config
    except Exception as e:
        print(f"Failed to load config file {config_path}: {e}")
        return {}

######################
# Print summary report
######################

def print_summary(results):
    print("\n" + "="*40)
    color_log("OSINT Audit Summary", Fore.MAGENTA, force=True)
    print("="*40 + "\n")

    subdomains = results.get("subdomains", {}).get("discovered", [])
    color_log(f"Total Subdomains Discovered: {len(subdomains)}", Fore.CYAN, force=True)
    if len(subdomains) > 0:
        for sd in subdomains[:5]:
            print(f"  - {sd}")
        if len(subdomains) > 5:
            print(f"  ... plus {len(subdomains)-5} more\n")
    else:
        color_log("  No subdomains found.", Fore.YELLOW, force=True)

    s3_buckets = results.get("s3_buckets", {})
    color_log(f"Public S3 Buckets Found: {len(s3_buckets)}", Fore.CYAN, force=True)
    for bucket_url in list(s3_buckets)[:5]:
        print(f"  - {bucket_url}")
    if len(s3_buckets) > 5:
        print(f"  ... plus {len(s3_buckets)-5} more\n")
    if len(s3_buckets) == 0:
        color_log("  No public S3 buckets found.", Fore.YELLOW, force=True)

    github_repos = results.get("github_repositories", [])
    color_log(f"GitHub Repositories Found: {len(github_repos)}", Fore.CYAN, force=True)
    for repo in github_repos[:5]:
        print(f"  - {repo.get('name')} ({repo.get('stars')}★) {repo.get('url')}")
    if len(github_repos) > 5:
        print(f"  ... plus {len(github_repos)-5} more\n")
    if len(github_repos) == 0:
        color_log("  No GitHub repositories found related to domain.", Fore.YELLOW, force=True)

    github_secrets = results.get("github_secrets", [])
    total_secrets = sum(len(repo.get("secrets_found", [])) for repo in github_secrets if isinstance(repo, dict))
    color_log(f"GitHub Secrets Discovered: {total_secrets}", Fore.CYAN, force=True)
    if total_secrets > 0:
        count = 0
        for repo in github_secrets:
            if not isinstance(repo, dict):
                continue
            secrets_count = len(repo.get('secrets_found', []))
            if secrets_count > 0:
                print(f"  - {repo.get('repo')}: {secrets_count} secrets found")
                count += 1
                if count >= 5:
                    break
        if total_secrets > 5:
            print(f"  ... plus secrets in {len(github_secrets)-count} more repos\n")
    else:
        color_log("  No secrets discovered in GitHub repositories.", Fore.YELLOW, force=True)

    pastebin_results = results.get("pastebin_results", [])
    count_pastes = len(pastebin_results) if isinstance(pastebin_results, list) else 0
    color_log(f"Pastebin Results Found: {count_pastes}", Fore.CYAN, force=True)
    for paste_url in pastebin_results[:5]:
        print(f"  - {paste_url}")
    if count_pastes > 5:
        print(f"  ... plus {count_pastes-5} more\n")
    if count_pastes == 0:
        color_log("  No Pastebin pastes referencing domain found.", Fore.YELLOW, force=True)

    print("="*40 + "\n")

#########################
# Main audit orchestration with concurrency
#########################

def audit_domain(domain, wordlist_path=None, github_token=None, hibp_api_key=None,
                 hunter_api_key=None, max_github_repos=5, max_secret_threads=4,
                 results_file=None, verbose=False):
    results = {
        "domain": domain,
        "subdomains": {},
        "s3_buckets": {},
        "github_repositories": [],
        "github_secrets": [],
        "pastebin_results": [],
    }

    color_log(f"\n===== OSINT audit for domain: {domain} =====\n", Fore.MAGENTA, verbose=True, force=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {}

        # Kick off subdomain discovery and concurrent S3 bucket discovery if wordlist provided
        if wordlist_path:
            futures['subdomains'] = executor.submit(discover_subdomains, domain, wordlist_path, verbose=verbose)
            futures['s3_buckets'] = executor.submit(discover_public_s3_buckets_concurrent, domain, wordlist_path, verbose=verbose)
        else:
            results["subdomains"]["discovered"] = []
            results["s3_buckets"] = {}

        # Kick off GitHub repo search
        futures['github_repos'] = executor.submit(search_github_repos, domain, github_token, max_github_repos, verbose)

        # Kick off Pastebin search
        futures['pastebin'] = executor.submit(search_pastebin, domain, verbose)

        # Wait for subdomain results
        if 'subdomains' in futures:
            found_subs = futures['subdomains'].result()
            results["subdomains"]["discovered"] = found_subs or []
        else:
            found_subs = []

        # Wait for S3 bucket results
        if 's3_buckets' in futures:
            s3_buckets = futures['s3_buckets'].result()
            results["s3_buckets"] = s3_buckets or {}

        # Wait for GitHub repos
        github_repos = futures['github_repos'].result()
        results['github_repositories'] = github_repos or []

        # Wait for Pastebin results
        pastebin_results = futures['pastebin'].result()
        results['pastebin_results'] = pastebin_results or []

    # Scan GitHub repos for secrets with multithreading
    if isinstance(github_repos, list) and github_repos:
        secret_scan_results = multithreaded_secret_scan(github_repos, max_threads=max_secret_threads, verbose=verbose)
        results['github_secrets'] = secret_scan_results
    else:
        results['github_secrets'] = []

    # Perform DNS, SSL, Leak, and Social Dossier scans on all subdomains + main domain concurrently (optional concurrency)
    def scan_domain_details(target):
        detail_result = {}
        detail_result['dns'] = get_dns_info(target, verbose)
        detail_result['ssl_cert'] = check_ssl_certificate(target, verbose)
        detail_result['leaks'] = search_leaks(target, hibp_api_key, verbose)
        detail_result['social_dossiers'] = get_social_dossiers(target, verbose, hunter_api_key)
        return target, detail_result

    all_domains = subdomains if subdomains else [domain]
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as detail_executor:
        detail_futures = {detail_executor.submit(scan_domain_details, d): d for d in all_domains}
        for future in concurrent.futures.as_completed(detail_futures):
            domain_scanned, data = future.result()
            results['subdomains'][domain_scanned] = data

    # Save JSON results if requested
    if results_file:
        save_results_to_json(results, results_file)

    # Print summary report
    print_summary(results)

#######################
# CLI and config parsing
#######################

def main():
    parser = argparse.ArgumentParser(description="Concurrent Modular OSINT audit with progress bars, colorized output, config support, and caching.")
    parser.add_argument("--config", help="Path to JSON config file with all options (alternative to CLI args)")
    parser.add_argument("domain", nargs='?', help="Target domain, e.g. example.com (if no config file provided)")
    parser.add_argument("--wordlist", help="Path to subdomain wordlist file (optional)")
    parser.add_argument("--github_token", help="GitHub personal access token (optional for higher API rate limits)")
    parser.add_argument("--hibp_api_key", help="HaveIBeenPwned API key (optional for breach searches)")
    parser.add_argument("--hunter_api_key", help="Hunter.io API key for email & social gathering (optional)")
    parser.add_argument("--max_github_repos", type=int, default=5, help="Max GitHub repos to scan for secrets")
    parser.add_argument("--max_secret_threads", type=int, default=4, help="Max threads for GitHub secret scans")
    parser.add_argument("--results_file", help="Path to output JSON file to save results (optional)")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    args = parser.parse_args()

    config = {}
    if args.config:
        config = load_config_from_file(args.config)

    domain = args.domain or config.get("domain")
    if not domain:
        print("Error: Domain must be specified either as a CLI argument or in the config file.")
        return

    wordlist_path = args.wordlist or config.get("wordlist")
    github_token = args.github_token or config.get("github_token")
    hibp_api_key = args.hibp_api_key or config.get("hibp_api_key")
    hunter_api_key = args.hunter_api_key or config.get("hunter_api_key")
    max_github_repos = args.max_github_repos if args.max_github_repos != 5 else config.get("max_github_repos", 5)
    max_secret_threads = args.max_secret_threads if args.max_secret_threads != 4 else config.get("max_secret_threads", 4)
    results_file = args.results_file or config.get("results_file")
    verbose = args.verbose or config.get("verbose", False)

    audit_domain(
        domain,
        wordlist_path=wordlist_path,
        github_token=github_token,
        hibp_api_key=hibp_api_key,
        hunter_api_key=hunter_api_key,
        max_github_repos=max_github_repos,
        max_secret_threads=max_secret_threads,
        results_file=results_file,
        verbose=verbose
    )

if __name__ == "__main__":
    main()
