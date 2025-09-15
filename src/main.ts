// Amplify configuration must run before importing router/components that may trigger generateClient
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { parseAmplifyConfig } from 'aws-amplify/utils';
const amplifyConfig = parseAmplifyConfig(outputs);
Amplify.configure(amplifyConfig);

// Now import the rest of the application
import router from './router';
import { installEntitlements } from './plugins/entitlements';
import SocialIcons from './components/SocialIcons.vue';
import './assets/theme.css';
import './assets/main.css';
import './assets/tokens.css';
import './assets/ui/popover.css';
import './assets/ui/modal.css';
import { createApp } from 'vue';
import App from './App.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faSearch,
  faUsers,
  faEye,
  faEyeSlash,
  faComment,
  faChartLine,
  faUser,
  faUserEdit,
  faFileAlt,
  faTachometerAlt,
  faNewspaper,
  faChartBar,
  faQuestionCircle,
  faThLarge,
  faTrash,
  faRedo,
  faSun,
  faMoon,
  faPlus,
  faEdit,
  faCheck,
  faTimes,
  faTags
} from '@fortawesome/free-solid-svg-icons';
import { faShieldHalved, faBriefcase, faBug, faPlusCircle, faCog, faArrowLeft, faSignOutAlt, faChevronLeft, faChevronRight, faRocket, faBoxesStacked } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faLifeRing } from '@fortawesome/free-solid-svg-icons';

library.add(
  faSearch,
  faUsers,
  faEye,
  faEyeSlash,
  faComment,
  faChartLine,
  faUser,
  faUserEdit,
  faFileAlt,
  faTachometerAlt,
  faNewspaper,
  faChartBar,
  faQuestionCircle,
  faThLarge,
  faTrash,
  faRedo,
  faSun,
  faMoon,
  faPlus,
  faEdit,
  faCheck,
  faTimes,
  faTags,
  faShieldHalved,
  faBriefcase,
  faBug,
  faPlusCircle,
  faCog,
  faArrowLeft,
  faSignOutAlt,
  faTwitter,
  faLinkedin,
  faGithub,
  faLifeRing
  ,faChevronLeft
  ,faChevronRight
  ,faRocket
  ,faBoxesStacked
);

const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.component('SocialIcons', SocialIcons);
app.use(router);
installEntitlements(app);
app.mount('#app');
