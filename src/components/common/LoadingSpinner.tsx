import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className={styles.spinner}>
      <div className={styles.spinnerIcon} />
      <div className={styles.spinnerText}>{message}</div>
    </div>
  );
}
