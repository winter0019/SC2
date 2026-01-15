
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
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 my-2 w-full max-w-sm mx-auto">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="bg-white border border-nysc-green/30 shadow-sm rounded-xl w-full h-10 sm:h-12 flex items-center justify-center mb-1 transition-all hover:border-amber-500">
            <span className="text-sm sm:text-lg font-black text-nysc-green tracking-tight">{item.value}</span>
          </div>
          <span className="text-[6px] md:text-[7px] uppercase tracking-widest text-gray-400 font-bold">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
