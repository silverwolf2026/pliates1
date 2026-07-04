import { createRouter, createWebHistory } from 'vue-router';
import QuizPage from '../views/QuizPage.vue';
import ResultPage from '../views/ResultPage.vue';
import PaymentPage from '../views/PaymentPage.vue';

const routes = [
  { path: '/', name: 'Quiz', component: QuizPage },
  { path: '/results', name: 'Results', component: ResultPage },
  { path: '/payment', name: 'Payment', component: PaymentPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
