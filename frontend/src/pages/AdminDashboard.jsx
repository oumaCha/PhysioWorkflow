import { useEffect, useMemo, useState } from "react";
import { workflowApi } from "../workflow/api/workflowApi";
import "../styles/AdminDashboard.css";

function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

export default function AdminDashboard() {
    // logs
    const [patients, setPatients] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logsErr, setLogsErr] = useState("");
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // users list
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersErr, setUsersErr] = useState("");

    // user creation
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("RECEPTIONIST");
    const [creating, setCreating] = useState(false);
    const [createMsg, setCreateMsg] = useState({ type: "", text: "" });

    // search/filter
    const [query, setQuery] = useState("");

    const loadLogs = async () => {
        setLoadingLogs(true);
        setLogsErr("");
        try {
            const data = await workflowApi.listAdminPatients();
            setPatients(Array.isArray(data) ? data : []);
            setLastRefreshed(new Date().toLocaleTimeString());
        } catch (e) {
            setLogsErr(String(e?.message || e));
        } finally {
            setLoadingLogs(false);
        }
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        setUsersErr("");
        try {
            const data = await workflowApi.listAdminUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            setUsersErr(String(e?.message || e));
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        loadLogs();
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredPatients = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return patients;

        return patients.filter((p) => {
            const name = String(p.fullName || "").toLowerCase();
            const node = String(p.currentNode || "").toLowerCase();
            return name.includes(q) || node.includes(q);
        });
    }, [patients, query]);

    const totalPatients = patients.length;
    const totalLogs = useMemo(
        () => patients.reduce((sum, p) => sum + (p.taskHistory?.length || 0), 0),
        [patients]
    );

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateMsg({ type: "", text: "" });

        const u = username.trim();
        if (!u || !password) {
            setCreateMsg({ type: "err", text: "Please enter username and password." });
            return;
        }

        try {
            setCreating(true);
            const res = await workflowApi.createUser({ username: u, password, role });
            setCreateMsg({ type: "ok", text: res?.message || "User created." });
            setUsername("");
            setPassword("");

            // refresh users list after create
            await loadUsers();
        } catch (e2) {
            setCreateMsg({ type: "err", text: String(e2?.message || e2) });
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="adminShell">
            <div className="adminTopbar">
                <div className="adminTitle">
                    <h2>Admin Dashboard</h2>
                    <p> patient workflow logs with Account User </p>
                </div>

                <span className="adminPill">
          Last refresh: <span className="mono">{lastRefreshed || "—"}</span>
        </span>
            </div>

            <div className="adminGrid">
                {/* Column 1: Create user */}
                <div className="adminPanel">
                    <div className="adminCard">
                        <div className="adminCardHeader">
                            <h3>Create new user</h3>
                            <span className="adminPill">Allowed: RECEPTIONIST / PHYSIOTHERAPIST</span>
                        </div>

                        <div className="adminCardBody">
                            <form className="adminRow" onSubmit={handleCreate}>
                                <div className="adminField">
                                    <div className="adminLabel">Username</div>
                                    <input
                                        className="adminInput"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g. reception2"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="adminField">
                                    <div className="adminLabel">Password</div>
                                    <input
                                        className="adminInput"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Choose a strong password"
                                        type="password"
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="adminField">
                                    <div className="adminLabel">Role</div>
                                    <select
                                        className="adminSelect"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="RECEPTIONIST">Receptionist</option>
                                        <option value="PHYSIOTHERAPIST">Physiotherapist</option>
                                    </select>
                                </div>

                                <button className="adminBtnPrimary" type="submit" disabled={creating}>
                                    {creating ? "Creating…" : "Create user"}
                                </button>

                                {createMsg.text ? (
                                    <div
                                        className={[
                                            "adminMsg",
                                            createMsg.type === "err" ? "adminMsgErr" : "",
                                            createMsg.type === "ok" ? "adminMsgOk" : "",
                                        ].join(" ")}
                                    >
                                        {createMsg.text}
                                    </div>
                                ) : null}
                            </form>
                        </div>
                    </div>
                </div>

                {/* Column 2: Users list */}
                <div className="adminPanel">
                    <div className="adminCard">
                        <div className="adminCardHeader">
                            <h3>Users</h3>
                            <button
                                className="adminBtnPrimary"
                                type="button"
                                onClick={loadUsers}
                                disabled={loadingUsers}
                            >
                                {loadingUsers ? "Loading…" : "Refresh"}
                            </button>
                        </div>

                        <div className="adminCardBody">
                            {usersErr ? <div className="adminMsg adminMsgErr">{usersErr}</div> : null}
                            {loadingUsers ? <div className="adminMsg">Loading users…</div> : null}

                            <div className="usersScroll">
                                <div className="usersList">
                                    {users.map((u) => (
                                        <div className="userRow" key={u.id}>
                                            <div>
                                                <div className="userName">{u.username}</div>
                                                <div className="userMeta">
                          <span>
                            ID: <span className="mono">{u.id}</span>
                          </span>
                                                    <span>
                            Status:{" "}
                                                        <span className="mono">{u.enabled ? "ENABLED" : "DISABLED"}</span>
                          </span>
                                                </div>
                                            </div>
                                            <span className="roleBadge">{u.role}</span>
                                        </div>
                                    ))}
                                </div>

                                {!loadingUsers && users.length === 0 ? (
                                    <div className="adminMsg">No receptionist/physio users yet.</div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Logs */}
                <div className="adminPanel">
                    <div className="adminCard adminLogsCard">
                        <div className="adminCardHeader">
                            <h3>Patient logs</h3>
                            <button className="adminBtnPrimary" onClick={loadLogs} disabled={loadingLogs} type="button">
                                {loadingLogs ? "Refreshing…" : "Refresh"}
                            </button>
                        </div>

                        <div className="adminCardBody">
                            <div className="adminToolbar">
                                <input
                                    className={"adminInput adminSearch"}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search patient or node…"
                                />

                                <div className="adminKpis">
                                    <div className="kpi">
                                        <div className="kpiLabel">Patients</div>
                                        <div className="kpiValue">{totalPatients}</div>
                                    </div>
                                    <div className="kpi">
                                        <div className="kpiLabel">Log entries</div>
                                        <div className="kpiValue">{totalLogs}</div>
                                    </div>
                                    <div className="kpi">
                                        <div className="kpiLabel">Shown</div>
                                        <div className="kpiValue">{filteredPatients.length}</div>
                                    </div>
                                </div>
                            </div>

                            {logsErr ? <div className="adminMsg adminMsgErr">{logsErr}</div> : null}
                            {loadingLogs ? <div className="adminMsg">Loading logs…</div> : null}

                            <div className="logsList">
                                {filteredPatients.map((p) => (
                                    <div className="patientCard" key={p.patientId}>
                                        <div className="patientHead">
                                            <div>
                                                <div className="patientName">{p.fullName}</div>
                                                <div className="patientMeta">
                                                    Current node: <span className="mono">{p.currentNode || "—"}</span>
                                                </div>
                                            </div>
                                            <span className="adminPill">
                        Entries: <span className="mono">{p.taskHistory?.length || 0}</span>
                      </span>
                                        </div>

                                        <div className="logBox">
                                            {(p.taskHistory || []).length === 0 ? (
                                                <div className="patientMeta">No workflow events yet.</div>
                                            ) : (
                                                (p.taskHistory || []).map((t) => (
                                                    <div className="logLine" key={t.id}>
                                                        <span className="mono">{t.nodeId}</span>
                                                        {"  —  "}
                                                        <b>{t.status}</b>
                                                        {"  —  "}
                                                        <span className="mono">{fmtDate(t.completedAt || t.createdAt)}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!loadingLogs && filteredPatients.length === 0 ? (
                                <div className="adminMsg">No patients match your search.</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}