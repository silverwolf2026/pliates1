<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAssessmentStore } from '../stores/assessment';

const store = useAssessmentStore();
const router = useRouter();
const processing = ref(false);
const done = ref(false);

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    popular: true,
    features: ['Full results & predictions', 'Weekly progress tracking', 'Custom meal plan', 'Pilates routines'],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$79.99',
    period: '/year',
    popular: false,
    features: ['Everything in Monthly', 'Save $40/year', 'Priority support', 'Exclusive content'],
    badge: 'Best Value',
  },
];

async function handlePay(planType: string) {
  processing.value = true;
  try {
    await store.makePayment(planType);
    done.value = true;
    // After short delay, go to results
    setTimeout(() => router.push('/results'), 1500);
  } catch {
    // error handled by store
  } finally {
    processing.value = false;
  }
}
</script>

<template>
  <div class="payment-container">
    <div class="header">
      <h1 class="title">Unlock Your Health Plan</h1>
      <p class="subtitle">Get the complete picture — including your goal prediction date</p>
    </div>

    <!-- Success state -->
    <div v-if="done" class="success-card">
      <div class="success-icon">✅</div>
      <h2>Payment Successful!</h2>
      <p>Welcome to premium. Redirecting to your results...</p>
    </div>

    <!-- Plan selection -->
    <template v-else>
      <div class="plans-grid">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ popular: plan.popular }"
        >
          <div v-if="plan.badge" class="badge">{{ plan.badge }}</div>
          <div class="plan-header">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <div class="plan-price">
              <span class="price">{{ plan.price }}</span>
              <span class="period">{{ plan.period }}</span>
            </div>
          </div>
          <ul class="plan-features">
            <li v-for="f in plan.features" :key="f">{{ f }}</li>
          </ul>
          <button
            class="btn-pay"
            :class="{ 'btn-monthly': plan.id === 'monthly', 'btn-yearly': plan.id === 'yearly' }"
            :disabled="processing"
            @click="handlePay(plan.id)"
          >
            {{ processing ? 'Processing...' : `Choose ${plan.name}` }}
          </button>
        </div>
      </div>

      <div class="trust-section">
        <p>🔒 Secure payment • Cancel anytime • 14-day money back</p>
        <button class="btn-back" @click="router.push('/results')">
          ← Back to results (free version)
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.payment-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 28px;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 8px 0 0;
}

.success-card {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
}

.success-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.success-card h2 {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.success-card p {
  color: #666;
}

.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.plan-card {
  background: #fff;
  border: 2px solid #e8e8f0;
  border-radius: 20px;
  padding: 24px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.plan-card.popular {
  border-color: #6c63ff;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.12);
}

.badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 10px;
  white-space: nowrap;
}

.plan-header {
  text-align: center;
  margin-bottom: 16px;
}

.plan-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.plan-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}

.price {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a2e;
}

.period {
  font-size: 14px;
  color: #888;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  flex: 1;
}

.plan-features li {
  padding: 6px 0;
  font-size: 13px;
  color: #555;
}

.plan-features li::before {
  content: '✓ ';
  color: #6c63ff;
  font-weight: 700;
}

.btn-pay {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pay:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-monthly {
  background: linear-gradient(135deg, #6c63ff, #5a52d5);
}

.btn-monthly:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(108, 99, 255, 0.4);
  transform: translateY(-1px);
}

.btn-yearly {
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.btn-yearly:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.4);
  transform: translateY(-1px);
}

.trust-section {
  text-align: center;
  margin-top: 24px;
}

.trust-section p {
  font-size: 13px;
  color: #888;
}

.btn-back {
  background: none;
  border: none;
  color: #6c63ff;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
  .title { font-size: 22px; }
}
</style>
