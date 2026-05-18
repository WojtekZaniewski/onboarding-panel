export type CalItemProps = {
  day: string;
  month: string;
  title: string;
  meta: string;
  channel: string;
};

export function CalItem({ day, month, title, meta, channel }: CalItemProps) {
  return (
    <li className="cal-item">
      <div className="cal-item__date">
        <span className="cal-item__day">{day}</span>
        <span className="cal-item__month">{month}</span>
      </div>
      <div className="cal-item__info">
        <div className="cal-item__title">{title}</div>
        <div className="cal-item__meta">{meta}</div>
      </div>
      <span className="cal-item__channel">{channel}</span>
    </li>
  );
}
