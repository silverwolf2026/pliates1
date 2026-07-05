import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as api from '../api';

export const useAssessmentStore = defineStore('assessment', () => {
  // 步骤定义
  const STEPS = [
    { id: 1, title: 'Gender & Goal', question: 'Tell us about yourself' },
    { id: 2, title: 'Age & Height', question: 'Your body metrics' },
    { id: 3, title: 'Weight', question: 'Current & target weight' },
    { id: 4, title: 'Activity', question: 'How active are you?' },
  ];

  // 状态
  const currentStep = ref(0);
  const maxStepReached = ref(0);
  const isCompleted = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const results = ref<Record<string, unknown> | null>(null);
  const subscriptionStatus = ref<string>('none');

  // 逐步骤校验错误 { fieldName: 'error message' }
  const stepErrors = ref<Record<string, string>>({});

  // 问卷数据
  const formData = ref<Record<string, unknown>>({
    gender: undefined,
    goal: undefined,
    age: undefined,
    heightCm: undefined,
    weightKg: undefined,
    targetWeightKg: undefined,
    activityLevel: undefined,
  });

  // 当前步骤定义
  const currentStepDef = computed(() => STEPS[currentStep.value] || null);
  const totalSteps = computed(() => STEPS.length);
  const progressPercent = computed(() =>
    totalSteps.value > 0 ? Math.round((currentStep.value / totalSteps.value) * 100) : 0,
  );

  // 初始化/检查 Session
  async function initSession() {
    const token = sessionStorage.getItem('sessionToken');
    if (token) {
      try {
        const progress = await api.getProgress();
        if (progress.data) {
          maxStepReached.value = progress.currentStep;
          currentStep.value = Math.min(progress.currentStep, STEPS.length - 1);
          formData.value = { ...formData.value, ...progress.data };
          isCompleted.value = progress.completed;
          return;
        }
      } catch {
        // Token 无效，重新创建
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('userId');
      }
    }
    // 创建新会话
    try {
      await api.createSession();
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to connect to server. Please refresh and try again.';
      console.error('Session creation failed:', e);
    }
  }

  // 保存当前步
  async function saveCurrentStep() {
    loading.value = true;
    error.value = null;
    try {
      const stepData: Record<string, unknown> = {};
      const fields = getStepFields(currentStep.value);
      for (const field of fields) {
        if (formData.value[field] !== undefined && formData.value[field] !== null) {
          stepData[field] = formData.value[field];
        }
      }
      const res = await api.saveStep(currentStep.value + 1, stepData);
      maxStepReached.value = Math.max(maxStepReached.value, res.currentStep);
      return res;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to save';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 下一步（先校验当前步，通过后才保存并前进）
  async function nextStep(): Promise<boolean> {
    if (!validateCurrentStep()) {
      return false;
    }
    await saveCurrentStep();
    if (currentStep.value < STEPS.length - 1) {
      currentStep.value++;
    }
    return true;
  }

  // 上一步
  function prevStep() {
    if (currentStep.value > 0) {
      currentStep.value--;
    }
  }

  // 提交全部
  async function submitAll() {
    loading.value = true;
    error.value = null;
    try {
      // 先保存最后一步
      await saveCurrentStep();
      // 提交
      const res = await api.submitAssessment();
      results.value = res.results;
      isCompleted.value = true;
      return res;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Submission failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 获取结果
  async function fetchResults() {
    loading.value = true;
    try {
      const res = await api.getResults();
      results.value = res.results as Record<string, unknown>;
      subscriptionStatus.value = res.subscriptionStatus;
      return res;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to load results';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 支付
  async function makePayment(planType: string) {
    loading.value = true;
    try {
      const res = await api.pay(planType);
      subscriptionStatus.value = res.status;
      return res;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Payment failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 获取当前步骤的字段
  function getStepFields(stepIndex: number): string[] {
    const stepFields: Record<number, string[]> = {
      0: ['gender', 'goal'],
      1: ['age', 'heightCm'],
      2: ['weightKg', 'targetWeightKg'],
      3: ['activityLevel'],
    };
    return stepFields[stepIndex] || [];
  }

  // 逐步骤校验：检查当前步所有必填字段
  function validateCurrentStep(): boolean {
    stepErrors.value = {};
    const fields = getStepFields(currentStep.value);
    const labels: Record<string, string> = {
      gender: 'Gender',
      goal: 'Goal',
      age: 'Age',
      heightCm: 'Height',
      weightKg: 'Current weight',
      targetWeightKg: 'Target weight',
      activityLevel: 'Activity level',
    };
    let valid = true;
    for (const field of fields) {
      const value = formData.value[field];
      if (value === undefined || value === null || value === '') {
        stepErrors.value[field] = `Please select your ${labels[field] || field}`;
        valid = false;
      }
    }
    return valid;
  }

  // 清空步骤校验错误
  function clearStepErrors() {
    stepErrors.value = {};
  }

  return {
    currentStep, maxStepReached, isCompleted, loading, error,
    results, subscriptionStatus, formData, stepErrors,
    currentStepDef, totalSteps, progressPercent, STEPS,
    initSession, saveCurrentStep, nextStep, prevStep,
    submitAll, fetchResults, makePayment,
    validateCurrentStep, clearStepErrors,
  };
});
