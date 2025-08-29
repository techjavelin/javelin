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
	faRedo
} from '@fortawesome/free-solid-svg-icons';

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
	faRedo
);
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import router from "./router";

Amplify.configure(outputs);

const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.use(router);
app.mount("#app");
