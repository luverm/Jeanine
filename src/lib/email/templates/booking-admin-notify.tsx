import { formatHumanDateTime } from "@/lib/time";

export type BookingAdminNotifyProps = {
  serviceName: string;
  startsAt: Date;
  endsAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  bookingUrl: string;
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
  width: "90px",
  color: "#78716c",
};

export function BookingAdminNotify(props: BookingAdminNotifyProps) {
  return (
    <div style={wrapper}>
      <h1 style={{ fontSize: "18px", margin: "0 0 12px" }}>Nieuwe boeking</h1>
      <p style={row}>
        <span style={label}>Wanneer</span>
        <strong>{formatHumanDateTime(props.startsAt)}</strong>
      </p>
      <p style={row}>
        <span style={label}>Dienst</span>
        {props.serviceName}
      </p>
      <p style={row}>
        <span style={label}>Klant</span>
        {props.customerName} &lt;{props.customerEmail}&gt;
      </p>
      <p style={row}>
        <span style={label}>Telefoon</span>
        {props.customerPhone}
      </p>
      {props.notes && (
        <p style={{ ...row, marginTop: "12px" }}>
          <span style={label}>Notitie</span>
          {props.notes}
        </p>
      )}
      <p style={{ marginTop: "16px" }}>
        <a href={props.bookingUrl}>Open in admin</a>
      </p>
    </div>
  );
}

export default BookingAdminNotify;
