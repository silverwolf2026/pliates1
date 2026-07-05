<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAssessmentStore } from '../stores/assessment';

const store = useAssessmentStore();
const router = useRouter();
const saving = ref(false);
const transitionDirection = ref<'next' | 'prev'>('next');

onMounted(async () => {
  await store.initSession();
  // If already completed, go to results
  if (store.isCompleted) {
    router.push('/results');
  }
});

const genderOptions = [
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'male', label: 'Male', emoji: '👨' },
];

const goalOptions = [
  { value: 'lose_weight', label: 'Lose Weight', emoji: '🔥', desc: 'Shed those extra pounds' },
  { value: 'gain_muscle', label: 'Gain Muscle', emoji: '💪', desc: 'Build strength & tone' },
  { value: 'maintain', label: 'Stay Fit', emoji: '✨', desc: 'Maintain my current shape' },
  { value: 'improve_flexibility', label: 'Flexibility', emoji: '🧘', desc: 'Move better & feel better' },
];

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary', emoji: '🪑', desc: 'Desk job, little exercise' },
  { value: 'light', label: 'Light', emoji: '🚶', desc: '1-2 days/week' },
  { value: 'moderate', label: 'Moderate', emoji: '🏃', desc: '3-5 days/week' },
  { value: 'heavy', label: 'Active', emoji: '🏋️', desc: '6-7 days/week' },
  { value: 'extreme', label: 'Very Active', emoji: '⚡', desc: 'Twice daily / pro athlete' },
];

async function handleNext() {
  store.clearStepErrors();
  saving.value = true;
  transitionDirection.value = 'next';
  try {
    const ok = await store.nextStep();
    if (!ok) {
      // 校验未通过，保持当前步
      saving.value = false;
      return;
    }
  } catch {
    // error shown in store
  } finally {
    saving.value = false;
  }
}

function handlePrev() {
  store.clearStepErrors();
  transitionDirection.value = 'prev';
  store.prevStep();
}

async function handleSubmit() {
  saving.value = true;
  try {
    const res = await store.submitAll();
    if (res) {
      router.push('/results');
    }
  } catch {
    // error shown in store
  } finally {
    saving.value = false;
  }
}

function selectOption(field: string, value: string | number) {
  store.formData[field] = value;
}

function isSelected(field: string, value: string | number) {
  return store.formData[field] === value;
}
</script>

<template>
  <div class="quiz-container">
    <!-- Header -->
    <div class="header">
      <h1 class="title">Your Health Journey</h1>
      <p class="subtitle">Discover your personalized Pilates & fitness plan</p>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: store.progressPercent + '%' }" />
      <div class="progress-text">
        Step {{ store.currentStep + 1 }} of {{ store.totalSteps }}
      </div>
    </div>

    <!-- Error message -->
    <div v-if="store.error" class="error-banner">
      {{ store.error }}
    </div>

    <!-- Step content -->
    <div class="step-card" :key="store.currentStep">
      <!-- Step 1: Gender & Goal -->
      <template v-if="store.currentStep === 0">
        <h2 class="step-title">First, tell us about yourself</h2>

        <div class="section">
          <label class="field-label">I am</label>
          <div class="option-grid">
            <button
              v-for="opt in genderOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: isSelected('gender', opt.value), error: store.stepErrors['gender'] }"
              @click="selectOption('gender', opt.value); store.clearStepErrors()"
            >
              <span class="option-emoji">{{ opt.emoji }}</span>
              <span class="option-label">{{ opt.label }}</span>
            </button>
          </div>
          <div v-if="store.stepErrors['gender']" class="field-error">{{ store.stepErrors['gender'] }}</div>
        </div>

        <div class="section">
          <label class="field-label">My goal is to</label>
          <div class="option-grid wide">
            <button
              v-for="opt in goalOptions"
              :key="opt.value"
              class="option-btn card"
              :class="{ selected: isSelected('goal', opt.value), error: store.stepErrors['goal'] }"
              @click="selectOption('goal', opt.value); store.clearStepErrors()"
            >
              <span class="option-emoji">{{ opt.emoji }}</span>
              <span class="option-label">{{ opt.label }}</span>
              <span class="option-desc">{{ opt.desc }}</span>
            </button>
          </div>
          <div v-if="store.stepErrors['goal']" class="field-error">{{ store.stepErrors['goal'] }}</div>
        </div>
      </template>

      <!-- Step 2: Age & Height -->
      <template v-if="store.currentStep === 1">
        <h2 class="step-title">Your body metrics</h2>
        <p class="step-hint">Don't worry, your data is private and secure.</p>

        <div class="section">
          <label class="field-label">Your Age</label>
          <input
            v-model.number="store.formData.age"
            type="number"
            class="form-input"
            :class="{ error: store.stepErrors['age'] }"
            placeholder="e.g. 28"
            min="10"
            max="120"
          />
          <div v-if="store.stepErrors['age']" class="field-error">{{ store.stepErrors['age'] }}</div>
        </div>

        <div class="section">
          <label class="field-label">Height (cm)</label>
          <input
            v-model.number="store.formData.heightCm"
            type="number"
            class="form-input"
            :class="{ error: store.stepErrors['heightCm'] }"
            placeholder="e.g. 165"
            min="50"
            max="250"
            step="0.1"
          />
          <div v-if="store.stepErrors['heightCm']" class="field-error">{{ store.stepErrors['heightCm'] }}</div>
        </div>
      </template>

      <!-- Step 3: Weight -->
      <template v-if="store.currentStep === 2">
        <h2 class="step-title">Your weight goals</h2>
        <p class="step-hint">Be honest — the more accurate, the better your plan.</p>

        <div class="section">
          <label class="field-label">Current Weight (kg)</label>
          <input
            v-model.number="store.formData.weightKg"
            type="number"
            class="form-input"
            :class="{ error: store.stepErrors['weightKg'] }"
            placeholder="e.g. 70"
            min="20"
            max="500"
            step="0.1"
          />
          <div v-if="store.stepErrors['weightKg']" class="field-error">{{ store.stepErrors['weightKg'] }}</div>
        </div>

        <div class="section">
          <label class="field-label">Target Weight (kg)</label>
          <input
            v-model.number="store.formData.targetWeightKg"
            type="number"
            class="form-input"
            :class="{ error: store.stepErrors['targetWeightKg'] }"
            placeholder="e.g. 60"
            min="15"
            max="500"
            step="0.1"
          />
          <div v-if="store.stepErrors['targetWeightKg']" class="field-error">{{ store.stepErrors['targetWeightKg'] }}</div>
        </div>
      </template>

      <!-- Step 4: Activity Level -->
      <template v-if="store.currentStep === 3">
        <h2 class="step-title">How active are you?</h2>
        <p class="step-hint">This helps us calculate your daily energy needs.</p>

        <div class="section">
          <div class="option-grid wide">
            <button
              v-for="opt in activityOptions"
              :key="opt.value"
              class="option-btn card"
              :class="{ selected: isSelected('activityLevel', opt.value), error: store.stepErrors['activityLevel'] }"
              @click="selectOption('activityLevel', opt.value); store.clearStepErrors()"
            >
              <span class="option-emoji">{{ opt.emoji }}</span>
              <span class="option-label">{{ opt.label }}</span>
              <span class="option-desc">{{ opt.desc }}</span>
            </button>
          </div>
          <div v-if="store.stepErrors['activityLevel']" class="field-error">{{ store.stepErrors['activityLevel'] }}</div>
        </div>
      </template>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button
          v-if="store.currentStep > 0"
          class="btn btn-secondary"
          @click="handlePrev"
        >
          ← Back
        </button>
        <div class="spacer" v-else />

        <button
          v-if="store.currentStep < store.totalSteps - 1"
          class="btn btn-primary"
          :disabled="saving"
          @click="handleNext"
        >
          {{ saving ? 'Saving...' : 'Continue →' }}
        </button>
        <button
          v-else
          class="btn btn-primary btn-submit"
          :disabled="saving || !store.formData.activityLevel"
          @click="handleSubmit"
        >
          {{ saving ? 'Calculating...' : 'Get My Results ✨' }}
        </button>
      </div>
    </div>

    <!-- Trust indicators -->
    <div class="trust-bar">
      <span>🔒 100% private</span>
      <span>⚡ Takes 2 minutes</span>
      <span>🎯 Science-based</span>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.subtitle {
  font-size: 15px;
  color: #666;
  margin: 8px 0 0;
}

.progress-bar {
  height: 8px;
  background: #e8e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6c63ff, #e67e22);
  border-radius: 8px;
  transition: width 0.4s ease;
}

.progress-text {
  text-align: right;
  font-size: 12px;
  color: #888;
  margin-bottom: 16px;
}

.error-banner {
  background: #fee;
  color: #c33;
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.step-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.step-hint {
  font-size: 14px;
  color: #888;
  margin: 0 0 20px;
}

.field-error {
  font-size: 13px;
  color: #e74c3c;
  margin-top: 6px;
  font-weight: 500;
}

.option-btn.error {
  border-color: #e74c3c;
  background: #fff5f5;
}

.form-input.error {
  border-color: #e74c3c;
  background: #fff5f5;
}

.section {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin-bottom: 10px;
}

.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.option-grid.wide {
  grid-template-columns: 1fr;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  border: 2px solid #e8e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn.card {
  flex-direction: row;
  gap: 12px;
  padding: 16px;
  text-align: left;
}

.option-btn:hover {
  border-color: #6c63ff;
  background: #f8f7ff;
}

.option-btn.selected {
  border-color: #6c63ff;
  background: #f0eeff;
}

.option-emoji {
  font-size: 28px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.option-desc {
  font-size: 12px;
  color: #888;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8e8f0;
  border-radius: 12px;
  font-size: 16px;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #6c63ff;
}

.form-input::placeholder {
  color: #bbb;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.spacer {
  width: 1px;
}

.btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #6c63ff, #5a52d5);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(108, 99, 255, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-submit {
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.btn-submit:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.4);
}

.btn-secondary {
  background: #f0f0f5;
  color: #555;
}

.btn-secondary:hover {
  background: #e4e4ec;
}

.trust-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;
  font-size: 13px;
  color: #888;
}

@media (max-width: 480px) {
  .option-grid {
    grid-template-columns: 1fr;
  }
  .title { font-size: 24px; }
  .quiz-container { padding: 20px 16px; }
}
</style>
