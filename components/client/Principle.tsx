export type PrincipleProps = {
  num: string;
  title: string;
  paragraphs: string[];
};

export function Principle({ num, title, paragraphs }: PrincipleProps) {
  return (
    <div className="principle">
      <div className="principle__num">{num}</div>
      <div>
        <h3 className="principle__title">{title}</h3>
        <div className="principle__body">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
