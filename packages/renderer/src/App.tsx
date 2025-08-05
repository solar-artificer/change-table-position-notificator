import './App.css'

import {spawnNotification} from '@app/preload';
import {useState, useRef} from 'react';


function App() {
  const [remainingSeconds, setRemainingSeconds] = useState( 1 * 3);

  const fullMinutes = Math.floor(remainingSeconds / 60);
  const secondsWithoutMinutes = remainingSeconds - fullMinutes * 60;

  const [intervalTimer, setIntervalTimer] = useState<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  function onCountDownFinish() {
    spawnNotification();
  }

  function startCountDown() {
    const intervalTimer = setInterval(() => {
      setRemainingSeconds(prevSeconds => {
        const newSeconds = prevSeconds - 1;

        if (newSeconds === 0) {
          // Clear the interval immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIntervalTimer(null);
          onCountDownFinish();
        }

        return newSeconds;
      });
    }, 1000);

    intervalRef.current = intervalTimer;
    setIntervalTimer(intervalTimer);
  }

  function stopCountDown() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIntervalTimer(null);
    }
  }

  function pauseCountDown() {
    if (intervalRef.current === null) {
      return;
    }
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIntervalTimer(null);
  }

  function resetCountDown() {
    stopCountDown();
    setRemainingSeconds(1 * 10);
  }


  return (
    <>
      <div className="card">
        <div>{String(fullMinutes).padStart(2, '0')}:{String(secondsWithoutMinutes).padStart(2, '0')}</div>
        <div>
          {intervalTimer === null && (
            <button onClick={() => startCountDown()}>
              <i className="fa-solid fa-play"></i>
            </button>
          )}
          {intervalTimer !== null && (
            <button onClick={() => pauseCountDown()}>
              <i className="fa-solid fa-pause"></i>
            </button>
          )}
          <button onClick={() => resetCountDown()}>
            <i className="fa-solid fa-arrow-rotate-left"></i>
          </button>
        </div>
      </div>
    </>
  )
}

export default App
