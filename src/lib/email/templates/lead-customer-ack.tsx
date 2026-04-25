import { business } from "@/content/business";

export type LeadCustomerAckProps = {
  fullName: string;
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
const body: React.CSSProperties = {
  fontSize: "15px",
  color: "#44403c",
  lineHeight: 1.7,
};

export function LeadCustomerAck({ fullName }: LeadCustomerAckProps) {
  return (
    <div style={wrapper}>
      <div style={card}>
        <h1 style={heading}>Hoi {fullName},</h1>
        <p style={body}>
          Wat fijn dat je contact hebt opgenomen voor je trouwdag — wat een
          mooie aanleiding. Ik neem binnen twee werkdagen persoonlijk contact
          op om je wensen door te nemen en je een passend voorstel te sturen.
        </p>
        <p style={body}>
          In de tussentijd: heb je inspiratiebeelden of een Pinterest-bord?
          Stuur ze gerust mee als reply op deze e-mail.
        </p>
        <p style={{ ...body, marginTop: "24px" }}>
          Tot snel,
          <br />
          {business.ownerName}
          <br />
          <span style={{ color: "#78716c" }}>{business.name}</span>
        </p>
      </div>
    </div>
  );
}

export default LeadCustomerAck;
