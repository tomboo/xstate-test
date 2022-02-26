import { createMachine, interpret, assign } from 'xstate';
// import { assign } from 'xstate/lib/actionTypes';

const ROWS = 6
const COLS = 5

const answers = [
  'hello',
  'world',
]

export const wordleMachine = createMachine({
  id: 'wordle',
  initial: "idle",
  context: {
    answer: '',
    guess: '',
    board: [],
    message: ''
  },
  // states
  states: {
    idle: {
      entry: 'initContext',
      on: {
        PLAY: { 
          target: 'playing',
          actions: [
            'getWord',
          ],
        },
      },
    },
    playing: {
      on: {
        RESET: {
          target: 'idle'
        },
        LETTER: {
          cond: (context) => context.guess.length < COLS,
          actions: 'fillCell',
          target: 'playing',
        },
        BACKSPACE: {
          cond: (context) => context.guess.length > 0,
          actions: 'clearCell',
          target: 'playing',
        },
        ENTER: {
          cond: (context) => context.guess.length === COLS,
          target: 'validate'
        },
      },
    },
    validate: {   // validate guess
      always: [
        { cond: 'isValid', target: 'guess', actions: 'completeRow' },
        { target: 'playing', actions: 'invalid' },
      ],
    },
    guess: {      // process valid guess
      // Transitions are tested one at a time.
      // The first valid transition will be taken.
      always: [
        { cond: 'isWin', target: 'gameOver', actions: 'win' },
        { cond: 'isLose', target: 'gameOver', actions: 'lose' },
        { target: 'playing', actions: 'continue' },
      ],
    },
    gameOver: {
      on: {
        RESET: {
          target: 'idle'
        }
      }
    },
  },
}).withConfig({
  actions: {
    initContext: assign({
      answer: '',
      guess: '',
      board: [],
      message: '',
    }),
    getWord: assign({       // get word of the day
      answer: 'world'
    }),
    /*
    fillCell: assign({
      guess: (context, event) => context.guess + event.letter,
    }),
    */
    fillCell: assign((context, event) => {
      console.log('* fillCell')
      return {
        guess: context.guess + event.letter
      }
    }),

    clearCell: assign({
      guess: (context) => context.guess.substring(0, context.guess.length - 1)
    }),

    completeRow: assign((context) => {
      console.log('* completeRow')
      return {
        board: [...context.board, context.guess],
        guess: ''
      }
    }),

    invalid: assign({
      message: 'INVALID',
    }),
    win: assign({
      message: 'WIN',
    }),
    lose: assign({
      message: 'LOSE'
    }),
    continue: assign({
      message: 'CONTINUE'
    }),
  },
  guards: {
    isValid: (context) => {
      const ret = answers.includes(context.guess)
      console.log('isValid', ret)
      return ret
    },
    isWin: (context) => {
      const ret = context.answer === context.board[context.board.length - 1]
      console.log('isWin', ret)
      return ret
    },
    isLose: (context) => {
      const ret = context.board.length >= ROWS
      console.log('isLose', ret)
      return ret
    }  
  }
})

// Run machine in Node/Vanilla JS

const wordleService =
  interpret(wordleMachine)
    .onTransition((state) => {
      console.log('---')
      console.log(
        'event: ', state.event
      )
      console.log(
        'state: ', state.value
      )
      console.log(
        'context: ', state.context
      )
    })
    .start()  // Start the service
    
wordleService.send({ type: 'PLAY' })
wordleService.send({ type: 'RESET' })

wordleService.send({ type: 'PLAY' })
wordleService.send({ type: 'LETTER', letter: 'h' })
wordleService.send({ type: 'BACKSPACE' })

wordleService.send({ type: 'PLAY' })
wordleService.send({ type: 'LETTER', letter: 'h' })
wordleService.send({ type: 'LETTER', letter: 'e' })
wordleService.send({ type: 'LETTER', letter: 'l' })
wordleService.send({ type: 'LETTER', letter: 'l' })
wordleService.send({ type: 'LETTER', letter: 'o' })
wordleService.send({ type: 'LETTER', letter: '!' })
wordleService.send({ type: 'ENTER' })
wordleService.send({ type: 'LETTER', letter: 'w' })
wordleService.send({ type: 'LETTER', letter: 'o' })
wordleService.send({ type: 'LETTER', letter: 'r' })
wordleService.send({ type: 'LETTER', letter: 'l' })
wordleService.send({ type: 'LETTER', letter: 'd' })
wordleService.send({ type: 'ENTER' })
