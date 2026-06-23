export default function StepIndicator({
  current,
  total,
}) {
  return (
    <div
      style={{
        marginBottom: 20,
      }}
    >
      <p>
        Étape {current} / {total}
      </p>

      <progress
        value={current}
        max={total}
        style={{
          width: "100%",
        }}
      />
    </div>
  );
}