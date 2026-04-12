interface Props {
  stars: number;
  max?: number;
}

export default function StarRating({ stars, max = 5 }: Props) {
  return (
    <span className="text-yellow-400" aria-label={`${stars} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i}>{i < stars ? '★' : '☆'}</span>
      ))}
    </span>
  );
}
