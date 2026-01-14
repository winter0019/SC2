
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
    <div className="grid grid-cols-2 xs:flex xs:justify-center gap-4 sm:gap-6 md:gap-8 my-4 md:my-8 w-full max-w-lg">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center flex-1">
          <div className="bg-white border-[3px] md:border-4 border-nysc-green shadow-lg md:shadow-xl rounded-[1.5rem] md:rounded-[2rem] w-full aspect-square xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center mb-2 md:mb-4 transition-all hover:scale-105 active:scale-95">
            <span className="text-2xl sm:text-3xl md:text-5xl font-black text-nysc-green tracking-tighter">{item.value}</span>
          </div>
          <span className="text-[8px] md:text-xs uppercase tracking-[0.2em] text-gray-400 font-black">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
