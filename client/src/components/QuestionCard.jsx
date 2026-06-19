export default function QuestionCard({
  question,
  value,
  onSelect,
}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 20,
        borderRadius: 10,
      }}
    >
      <h2>{question.title}</h2>

      {question.options.map((option) => (
        <div key={option}>
          <label>
            <input
              type="radio"
              checked={value === option}
              onChange={() => onSelect(option)}
            />

            {" "}

            {option}
          </label>
        </div>
      ))}
    </div>
  );
}