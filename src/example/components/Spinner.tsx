import React from "react";

import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 28,
  color = "#007aff",
  thickness = 3,
  label,
}) => {
  const dim = size;
  return (
    <div className={styles.spinner}>
      <div
        className={styles.spinnerCircle}
        style={{
          width: dim,
          height: dim,
          borderWidth: thickness,
          borderTopColor: color,
        }}
      />
      {label && <div style={{ whiteSpace: "nowrap" }}>{label}</div>}
    </div>
  );
};

export default Spinner;
