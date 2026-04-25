import { format } from "date-fns";

export type LeadAdminNotifyProps = {
  fullName: string;
  email: string;
  phone: string;
  weddingDate: string; // YYYY-MM-DD
  city: string;
  postcode: string;
  partySize: number;
  servicesWanted: string[];
  budgetCents?: number | null;
  message?: string;
  leadUrl: string;
};

const wrapper: React.CSSProperties = {
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  color: "#1c1917",
  padding: "16px",
};
const row: React.CSSProperties = { fontSize: "14px", margin: "4px 0" };
const label: React.CSSProperties = {
  display: "inline-block",
  width: "120px",
  color: "#78716c",
};

export function LeadAdminNotify(props: LeadAdminNotifyProps) {
  const wedding = (() => {
    try {
      return format(new Date(props.weddingDate), "EEEE d MMMM yyyy");
    } catch {
      return props.weddingDate;
    }
  })();

  return (
    <div style={wrapper}>
      <h1 style={{ fontSize: "18px", margin: "0 0 12px" }}>Nieuwe bruidslead</h1>
      <p style={row}>
        <span style={label}>Naam</span>
        <strong>{props.fullName}</strong>
      </p>
      <p style={row}>
        <span style={label}>E-mail</span>
        <a href={`mailto:${props.email}`} style={{ color: "#1c1917" }}>
          {props.email}
        </a>
      </p>
      <p style={row}>
        <span style={label}>Telefoon</span>
        <a href={`tel:${props.phone}`} style={{ color: "#1c1917" }}>
          {props.phone}
        </a>
      </p>
      <p style={row}>
        <span style={label}>Trouwdatum</span>
        {wedding}
      </p>
      <p style={row}>
        <span style={label}>Locatie</span>
        {props.city} ({props.postcode})
      </p>
      <p style={row}>
        <span style={label}>Aantal</span>
        {props.partySize}
      </p>
      <p style={row}>
        <span style={label}>Diensten</span>
        {props.servicesWanted.join(", ")}
      </p>
      {typeof props.budgetCents === "number" && (
        <p style={row}>
          <span style={label}>Budget</span>
          {`€ ${(props.budgetCents / 100).toLocaleString("nl-NL")}`}
        </p>
      )}
      {props.message && (
        <p style={{ ...row, marginTop: "12px", whiteSpace: "pre-line" }}>
          <span style={{ ...label, verticalAlign: "top" }}>Bericht</span>
          <span style={{ display: "inline-block", maxWidth: "440px" }}>
            {props.message}
          </span>
        </p>
      )}
      <p style={{ marginTop: "16px" }}>
        <a href={props.leadUrl}>Open in admin</a>
      </p>
    </div>
  );
}

export default LeadAdminNotify;
