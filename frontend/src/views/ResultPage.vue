<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAssessmentStore } from '../stores/assessment';

const store = useAssessmentStore();
const router = useRouter();
const loadingResults = ref(true);

onMounted(async () => {
  try {
    await store.fetchResults();
  } catch {
    // Not completed — redirect to quiz
    router.push('/');
  } finally {
    loadingResults.value = false;
  }
});

function goToPayment() {
  router.push('/payment');
}
</script>

<template>
  <div class="results-container">
    <!-- Loading -->
    <div v-if="loadingResults" class="loading-state">
      <div class="spinner" />
      <p>Loading your results...</p>
    </div>

    <!-- Results -->
    <template v-else-if="store.results">
      <div class="header">
        <h1 class="title">Your Health Assessment</h1>
        <p class="subtitle">Here's what your body is telling us</p>
      </div>

      <!-- Premium badge -->
      <div v-if="store.results.isPremium" class="premium-badge">
        ⭐ Premium Results
      </div>

      <!-- BMI Card -->
      <div class="result-card">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-label">Body Mass Index (BMI)</div>
          <div class="card-value">{{ store.results.bmi }}</div>
          <div v-if="store.results.bmiCategory" class="card-sub">
            Category: <strong>{{ store.results.bmiCategory }}</strong>
          </div>
        </div>
      </div>

      <!-- Daily Calories -->
      <div class="result-card">
        <div class="card-icon">🔥</div>
        <div class="card-content">
          <div class="card-label">Daily Calorie Target</div>
          <div class="card-value">{{ store.results.dailyCalories }}</div>
          <div class="card-sub">Personalized for your goal</div>
        </div>
      </div>

      <!-- Predicted Date (premium only) -->
      <div v-if="store.results.predictedDate" class="result-card">
        <div class="card-icon">🎯</div>
        <div class="card-content">
          <div class="card-label">Estimated Goal Date</div>
          <div class="card-value">{{ new Date(store.results.predictedDate as string).toLocaleDateString() }}</div>
          <div class="card-sub">Stay consistent — you've got this!</div>
        </div>
      </div>

      <!-- Premium upsell -->
      <div v-if="!store.results.isPremium" class="upsell-card">
        <div class="upsell-icon">🔒</div>
        <h3 class="upsell-title">Unlock Your Full Potential</h3>
        <p class="upsell-text">
          Get your personalized <strong>predicted goal date</strong>,
          <strong>weekly progress tracking</strong>, and a
          <strong>custom meal & workout plan</strong> — all tailored to you.
        </p>
        <ul class="upsell-features">
          <li>📅 Exact date prediction</li>
          <li>📈 Weekly progress dashboard</li>
          <li>🥗 Custom meal plan ({{ store.results.dailyCalories }})</li>
          <li>🧘 Pilates routine builder</li>
        </ul>
        <button class="btn-premium" @click="goToPayment">
          Upgrade Now — Only $9.99/mo
        </button>
        <p class="upsell-note">Cancel anytime • 14-day money back</p>
      </div>

      <!-- Premium thank you -->
      <div v-else class="premium-thankyou">
        <div class="thank-icon">🌟</div>
        <h3>You're all set!</h3>
        <p>Your premium plan is active. Check back for weekly updates.</p>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="store.error" class="error-state">
      <p>⚠️ {{ store.error }}</p>
      <button class="btn btn-primary" @click="router.push('/')">
        Start Assessment
      </button>
    </div>
  </div>
</template>

<style scoped>
.results-container {
  max-width: 520px;
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
  margin: 6px 0 0;
}

.premium-badge {
  text-align: center;
  background: linear-gradient(135deg, #f9e547, #f0c040);
  color: #333;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
  display: inline-block;
  width: auto;
}

.result-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.card-icon {
  font-size: 32px;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.card-sub {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.upsell-card {
  text-align: center;
  background: linear-gradient(180deg, #fff 0%, #f8f7ff 100%);
  border: 2px solid #e8e4ff;
  border-radius: 20px;
  padding: 28px 24px;
  margin-top: 20px;
}

.upsell-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.upsell-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.upsell-text {
  font-size: 14px;
  color: #555;
  margin: 0 0 16px;
  line-height: 1.6;
}

.upsell-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  text-align: left;
}

.upsell-features li {
  padding: 8px 0;
  font-size: 14px;
  color: #444;
  border-bottom: 1px solid #f0f0f5;
}

.btn-premium {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 126, 34, 0.4);
}

.upsell-note {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

.premium-thankyou {
  text-align: center;
  padding: 32px 20px;
  color: #1a1a2e;
}

.thank-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.premium-thankyou h3 {
  font-size: 22px;
  margin: 0 0 8px;
}

.premium-thankyou p {
  color: #666;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e8e8f0;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #6c63ff, #5a52d5);
  color: #fff;
  margin-top: 16px;
}
</style>
