
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
    <div className="grid grid-cols-2 xs:flex xs:justify-center gap-4 sm:gap-6 my-4 w-full max-w-md mx-auto">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center flex-1">
          <div className="bg-white border-2 border-nysc-green shadow-lg rounded-2xl w-full aspect-square xs:w-16 xs:h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1.5 transition-all hover:scale-105">
            <span className="text-xl sm:text-2xl font-black text-nysc-green tracking-tighter">{item.value}</span>
          </div>
          <span className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-gray-400 font-black">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
