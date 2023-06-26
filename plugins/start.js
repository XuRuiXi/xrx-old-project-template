
class start {
  constructor() {
    this.name = 'start123';
  }
  apply(hooks) {
    hooks.start.tap(this.name, stats => {
        console.log('start');
        // console.log(stats);
    });
  }
}

module.exports = start;
