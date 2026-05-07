const normalize = (value = '') => value.toString().toLowerCase().replaceAll('_', '-');

const Badge = ({ value, tone = 'status' }) => (
  <span className={`badge badge-${tone}-${normalize(value)}`}>
    {value?.toString().replaceAll('_', ' ') || 'Unknown'}
  </span>
);

export default Badge;
