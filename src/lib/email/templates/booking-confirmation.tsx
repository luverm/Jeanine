import { business } from "@/content/business";
import { formatHumanDateTime } from "@/lib/time";

export type BookingConfirmationProps = {
  customerName: string;
  serviceName: string;
  startsAt: Date;
  endsAt: Date;
};

const wrapper: React.CSSProperties = {
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  color: "#1c1917",
  background: "#fafaf9",
  padding: "24px 0",
};
const card: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e7e5e4",
  borderRadius: "12px",
  padding: "32px",
};
const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  margin: "0 0 16px",
};
const subtle: React.CSSProperties = {
  fontSize: "14px",
  color: "#57534e",
  lineHeight: 1.6,
};
const detailRow: React.CSSProperties = {
  fontSize: "15px",
  margin: "8px 0",
};
const label: React.CSSProperties = {
  display: "inline-block",
  width: "90px",
  color: "#78716c",
};

export function BookingConfirmation(props: BookingConfirmationProps) {
  return (
    <div style={wrapper}>
      <div style={card}>
        <h1 style={heading}>Hoi {props.customerName},</h1>
        <p style={subtle}>
          Je afspraak bij {business.name} is bevestigd. We zien je graag op het
          afgesproken moment.
        </p>

        <div style={{ marginTop: "24px", borderTop: "1px solid #e7e5e4", paddingTop: "16px" }}>
          <p style={detailRow}>
            <span style={label}>Dienst</span>
            <strong>{props.serviceName}</strong>
          </p>
          <p style={detailRow}>
            <span style={label}>Wanneer</span>
            {formatHumanDateTime(props.startsAt)}
          </p>
          {business.address.street && (
            <p style={detailRow}>
              <span style={label}>Locatie</span>
              {business.address.street}, {business.address.postcode}{" "}
              {business.address.city}
            </p>
          )}
        </div>

        <p style={{ ...subtle, marginTop: "24px" }}>
          Verhinderd? Stuur een bericht naar{" "}
          <a href={`mailto:${business.email}`} style={{ color: "#1c1917" }}>
            {business.email}
          </a>
          {business.phone ? `, of bel ${business.phone}` : ""}.
        </p>

        <p style={{ ...subtle, marginTop: "32px" }}>
          Tot snel,
          <br />
          {business.ownerName}
        </p>
      </div>
    </div>
  );
}

export default BookingConfirmation;
