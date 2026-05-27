import { useState } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// project imports
import MainCard from "components/cards/MainCard";
import ChosenSelect from "components/ChosenSelect";

// assets
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

export default function CreateUser() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ role: "", department: "", status: "Active" });

    return (
        <Stack sx={{ gap: 2 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h2">Create User</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add a user and assign access for election portal
                        operations.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ArrowBackOutlined />}
                    onClick={() => navigate("/admin/users/access-management")}
                >
                    Back
                </Button>
            </Stack>

            <Box
                component="form"
                onSubmit={(event) => {
                    event.preventDefault();
                    navigate("/admin/users/access-management");
                }}
            >
                <MainCard
                    title="User Details"
                    sx={{
                        borderRadius: 2,
                        boxShadow: "0 10px 30px rgba(16, 60, 92, 0.08)",
                    }}
                    headerSX={{
                        p: 2,
                        "& .MuiCardHeader-title": { fontSize: "1rem" },
                    }}
                    contentSX={{ p: 2, "&:last-child": { pb: 2 } }}
                >
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                placeholder="Enter user name"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="User ID"
                                placeholder="Enter user ID"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                placeholder="Enter email address"
                                type="email"
                                slotProps={{
                                    input: {
                                        inputProps: { autoComplete: "email" },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Mobile Number"
                                placeholder="Enter mobile number"
                                slotProps={{
                                    input: {
                                        inputProps: {
                                            autoComplete: "tel",
                                            inputMode: "numeric",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <ChosenSelect
                                    value={form.role}
                                    placeholder="Select Role"
                                    options={[
                                        { value: 1, label: "Super Admin" },
                                        { value: 2, label: "Admin" },
                                        { value: 3, label: "Data Entry" },
                                        { value: 4, label: "Verifier" },
                                        { value: 5, label: "Booth Officer" },
                                        { value: 6, label: "Report Viewer" },
                                    ]}
                                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                                />
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <ChosenSelect
                                    value={form.department}
                                    placeholder="Select Department"
                                    options={[
                                        { value: "Election Office", label: "Election Office" },
                                        { value: "Voter Cell", label: "Voter Cell" },
                                        { value: "Polling Operations", label: "Polling Operations" },
                                        { value: "Verification Team", label: "Verification Team" },
                                        { value: "Reports", label: "Reports" },
                                        { value: "Access Management", label: "Access Management" },
                                    ]}
                                    onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                                />
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <ChosenSelect
                                    value={form.status}
                                    options={[
                                        { value: "Active", label: "Active" },
                                        { value: "Pending", label: "Pending" },
                                        { value: "Inactive", label: "Inactive" },
                                    ]}
                                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                                />
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Temporary Password"
                                placeholder="Enter temporary password"
                                type="password"
                                slotProps={{
                                    input: {
                                        inputProps: {
                                            autoComplete: "new-password",
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Address"
                                placeholder="Enter complete address"
                            />
                        </Grid>
                    </Grid>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        sx={{ justifyContent: "flex-end", gap: 1.5, mt: 3 }}
                    >
                        <Button
                            type="button"
                            variant="outlined"
                            color="inherit"
                            onClick={() =>
                                navigate("/admin/users/access-management")
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveOutlined />}
                        >
                            Save User
                        </Button>
                    </Stack>
                </MainCard>
            </Box>
        </Stack>
    );
}
