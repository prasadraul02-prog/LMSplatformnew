"use client"

export default function SentryTestPage() {
    return (
        <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
            <h1>Sentry Integration Test</h1>
            <p>Click the button below to trigger a test error and verify Sentry is working.</p>
            <button
                onClick={() => {
                    throw new Error("Sentry Test Error: " + new Date().toISOString());
                }}
                style={{
                    padding: "10px 20px",
                    backgroundColor: "#e03e2f",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
            >
                Break the App!
            </button>
        </div>
    );
}
