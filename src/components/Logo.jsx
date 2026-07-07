const Logo = ({ className = "h-10 w-auto" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="200" height="60" rx="8" fill="#005A9C" />
      <text x="15" y="38" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white">
        SEBRAE
      </text>
      <text x="100" y="38" fontFamily="Arial, sans-serif" fontSize="14" fill="#FF6B00" fontWeight="bold">
        MONITOR
      </text>
      <circle cx="180" cy="30" r="12" fill="#FF6B00" />
      <text x="174" y="35" fontFamily="Arial, sans-serif" fontSize="12" fill="white" fontWeight="bold">
        N2
      </text>
    </svg>
  );
};

export default Logo;