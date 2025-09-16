import neostandard from 'neostandard'

export default [
  ...neostandard({
    ts: true,
    noJsx: true,
  }),
  {
    rules: {
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
    },
  },
]
