import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

type SelectValue = string | number;

export type ChosenSelectOption = {
  value: SelectValue;
  label: string;
  disabled?: boolean;
};

type ChosenSelectProps = {
  value?: SelectValue | null;
  options: ChosenSelectOption[];
  onChange: (event: { target: { value: any } }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  size?: 'small' | 'medium';
  className?: string;
  error?: boolean;
  helperText?: string;
  id?: string;
};

export default function ChosenSelect({
  value,
  options,
  onChange,
  label,
  placeholder,
  required = false,
  size = 'small',
  className = 'chosen-select',
  error,
  helperText,
  id
}: ChosenSelectProps) {
  const normalizedValue = value ?? '';
  const selectedOption = options.find((option) => String(option.value) === String(normalizedValue)) || null;
  const canClear = !required || options.some((option) => option.value === '');

  return (
    <Autocomplete
      className={className}
      fullWidth
      size={size}
      options={options}
      value={selectedOption}
      disableClearable={!canClear}
      getOptionDisabled={(option) => Boolean(option.disabled)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => String(option.value) === String(selected.value)}
      onChange={(_, option) => onChange({ target: { value: option?.value ?? '' } })}
      renderInput={(params) => <TextField {...params} id={id} required={required} label={label} placeholder={placeholder} error={error} helperText={helperText} />}
    />
  );
}
