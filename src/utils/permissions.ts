export const getDbPageString = (path: string): string => {
  if (!path) return '';
  const parts = path.split('/').filter(Boolean);
  
  if (parts.length === 0) return 'Dashboard';
  
  if (parts.length === 1) {
      if (parts[0] === 'resource-manager') return 'Resource Manager';
      // Capitalize first letter of single words
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  
  if (parts.length >= 2) {
      const system = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      // Split by hyphen, capitalize each part, join by space
      const page = parts[1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      // Handle special cases where 'All' is combined with system name in DB
      if (page === 'All' && system === 'Loan') return 'Loan/All';
      if (page === 'All' && system === 'Document') return 'Document/All';
      if (page === 'All' && system === 'Subscription') return 'Subscription/All';
      
      return `${system}/${page}`;
  }
  
  return '';
};

export const getPathFromDbString = (dbString: string): string | null => {
   if (dbString === 'Dashboard') return '/';
   if (dbString === 'Resource Manager') return '/resource-manager';
   if (dbString === 'Master') return '/master';
   if (dbString === 'Settings') return '/settings';

   const parts = dbString.split('/');
   if (parts.length === 2) {
       const system = parts[0].toLowerCase();
       const page = parts[1].toLowerCase().replace(/\s+/g, '-');
       return `/${system}/${page}`;
   }
   
   return null;
};
