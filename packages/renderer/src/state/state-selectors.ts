const isRestingSelector = (snapshot: any) => {
  return snapshot.context.currentMode === 'resting';
}

const isStandingSelector = (snapshot: any) => {
  return snapshot.context.currentMode === 'standing';
}

const isTickingSelector = (snapshot: any) => {
  return (
    snapshot.value.flow?.resting === 'ticking'
    || snapshot.value.flow?.standing === 'ticking'
  )
}

const isRingingSelector = (snapshot: any) => {
  return (
    snapshot.value.ringerFromRestingToStanding === 'ringing'
    || snapshot.value.ringerFromStandingToResting === 'ringing'
  )
}

export {
  isRestingSelector,
  isStandingSelector,
  isTickingSelector,
  isRingingSelector
}
