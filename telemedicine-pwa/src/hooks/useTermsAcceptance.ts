import { useState, useEffect } from 'react';

export const useTermsAcceptance = (userId: string) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has previously accepted terms
    const acceptedTerms = localStorage.getItem(`terms_accepted_${userId}`);
    if (acceptedTerms) {
      setHasAcceptedTerms(true);
    }
  }, [userId]);

  const handleAcceptTerms = () => {
    localStorage.setItem(`terms_accepted_${userId}`, 'true');
    setHasAcceptedTerms(true);
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
  };

  const checkTermsAcceptance = () => {
    if (!hasAcceptedTerms) {
      setShowTerms(true);
      return false;
    }
    return true;
  };

  return {
    showTerms,
    hasAcceptedTerms,
    handleAcceptTerms,
    handleDeclineTerms,
    checkTermsAcceptance
  };
}; 