import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faSearch,
	faUsers,
	faEye,
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
	faMoon
} from '@fortawesome/free-solid-svg-icons';

import { faTwitter, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faLifeRing } from '@fortawesome/free-solid-svg-icons';
library.add(
	faSearch,
	faUsers,
	faEye,
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
	faTwitter,
	faLinkedin,
	faGithub,
	faLifeRing
);

import outputs from "../amplify_outputs.json";
import router from "./router";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";

const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure({
	...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: outputs.custom.API,
    },
  },
  {
    API: {
      REST: {
        retryStrategy: {
          strategy: 'no-retry', // Overrides default retry strategy
        },
      }
    }

});

import SocialIcons from './components/SocialIcons.vue';
const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.component('SocialIcons', SocialIcons);
app.use(router);
app.mount("#app");
