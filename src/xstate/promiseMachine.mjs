import { createMachine, interpret } from 'xstate';

export const promiseMachine = createMachine({
  id: 'promise',
  initial: 'pending',
  states: {
    pending: {
      on: {
        RESOLVE: { target: 'resolved' },
        REJECT: { target: 'rejected' }
      }
    },
    resolved: {
      type: 'final'
    },
    rejected: {
      type: 'final'
    }
  }
})

// Run machine in Node/Vanilla JS

/*
const promiseService =
  interpret(promiseMachine)
    .onTransition((state) => {
      console.log(
        'state: ', state.value,
        ' / event: ', state.event
      )
    })
    .start()  // Start the service
    
promiseService.send({ type: 'RESOLVE' });
*/