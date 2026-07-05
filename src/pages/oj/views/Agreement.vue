<template>
  <div class="agreement-page">
    <div class="agreement-container">
      <AgreementContent />
    </div>
  </div>
</template>

<script>
import AgreementContent from '@oj/components/AgreementContent'
export default { components: { AgreementContent } }
</script>

<style scoped>
.agreement-page { min-height: calc(100vh - 80px); background: #f5f7fa; padding: 40px 0; margin-top: 80px; }
.agreement-container { max-width: 800px; margin: 0 auto; padding: 30px; background: #fff; border-radius: 12px; }
</style>
