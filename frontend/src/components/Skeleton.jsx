const Skeleton = ({ rows = 3, type = 'card' }) => (
  <div className={`skeleton-block skeleton-${type}`} aria-label="Loading">
    {Array.from({ length: rows }, (_, index) => (
      <span key={index} />
    ))}
  </div>
);

export default Skeleton;
