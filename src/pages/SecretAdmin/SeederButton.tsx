import React, { useState } from 'react';
import { initServices } from '../../utils/initServices'; // ✅ Correct relative path
import { firestore } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

type SeederButtonProps = {
  style?: React.CSSProperties;
  className?: string;
};

const SeederButton: React.FC<SeederButtonProps> = ({ style, className }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await initServices();
      
      // ✅ Verify services were added to Firestore
      const servicesSnapshot = await getDocs(collection(firestore, 'services'));
      const servicesCount = servicesSnapshot.size;
      
      console.log(`✅ Seeding completed. Found ${servicesCount} services in Firestore.`);
      
      if (servicesCount > 0) {
        alert(`✅ All default services added successfully! (${servicesCount} services in database)`);
      } else {
        alert('⚠️ Services seeding completed but no services found in database');
      }
    } catch (err) {
      console.error('❌ Failed to add services:', err);
      alert('❌ Failed to add services');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Add Default Services"
      className={className}
      style={{
        ...(style || {}),
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Adding Services...' : 'Add Default Services'}
    </button>
  );
};

export default SeederButton;
