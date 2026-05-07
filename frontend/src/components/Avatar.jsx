const initialsFromName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AI';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

const Avatar = ({ name, color = '#7091E6', size = 'md' }) => (
  <span className={`avatar avatar-${size}`} style={{ backgroundColor: color }}>
    {initialsFromName(name)}
  </span>
);

export default Avatar;
