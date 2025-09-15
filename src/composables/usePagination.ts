import { ref } from 'vue'

export interface PaginationState { nextToken: string | null; itemsPerPage: number }

export function usePagination(defaultPageSize = 25) {
  const nextToken = ref<string | null>(null)
  const loadingMore = ref(false)
  const itemsPerPage = ref(defaultPageSize)

  function reset() { nextToken.value = null }
  function update(token?: string | null) { nextToken.value = token ?? null }

  return { nextToken, loadingMore, itemsPerPage, reset, update }
}
