import { Icon } from "./Icon";
export function TooltipButton({ icon, label, active = false, className = "", ...props }) {
  return <button className={`icon-button ${active ? "is-active" : ""} ${className}`} aria-label={label} title={label} {...props}><Icon name={icon}/><span className="tooltip" role="tooltip">{label}</span></button>;
}
