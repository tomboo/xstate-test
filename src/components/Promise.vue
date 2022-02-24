<script setup>
  import { useMachine } from '@xstate/vue';
  import { promiseMachine } from '../xstate/promise'
  const { state, send, service } = useMachine(promiseMachine)

  // Debug
  window.send = send
  service.subscribe((state) => {
    // console.log(state)
    console.log(
      'state: ' + state.value
      , '| event: ' + state.event.type
//      , '| context: ', state.context
    )
    //debugger
  })
</script>
<template>
  <button @click="send({ type: 'RESOLVE' })">RESOLVE</button>
  <button @click="send({ type: 'REJECT' })">REJECT</button>
</template>
<style scoped>
</style>