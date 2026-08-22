import { forwardRef } from 'react';
import './CustomSelect.css';

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  id: string;
}

const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  ({ options, id, className = '', children, ...props }, ref) => {
    return (
      <div className="custom-select-wrapper">
        <select
          ref={ref}
          id={id}
          className={`custom-select ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="select-arrow" aria-hidden="true">▼</span>
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;