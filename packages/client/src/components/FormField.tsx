import { Input } from "./ui/input";
import { Label } from "./ui/label";

type FormFieldProps = {
  label?: string;
  type?: string;
  registration: object;
  error?: string;
  placeholder?: string;
  className?: string;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  type = "text",
  registration,
  error,
  className,
}) => {
  return (
    <div className="form-group w-full">
      {label && <Label>{label}</Label>}
      <Input
        className={className ?? ""}
        type={type}
        placeholder={placeholder ?? ""}
        {...registration}
      />
      {error && <p className=" pt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;
