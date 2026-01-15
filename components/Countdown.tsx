
import React, { useState, useEffect } from 'react';

const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const items = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-full overflow-hidden px-2">
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center min-w-[50px] sm:min-w-[70px]">
            <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-1 leading-none">
              {item.value.toString().padStart(2, '0')}
            </div>
            <span className="text-[6px] sm:text-[7px] md:text-[8px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-black opacity-40">
              {item.label}
            </span>
          </div>
          {i < items.length - 1 && (
            <div className="text-xl sm:text-2xl font-black opacity-20 mt-[-10px] sm:mt-[-15px] select-none">
              :
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Countdown;
