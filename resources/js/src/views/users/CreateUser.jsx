import { useNavigate } from "react-router-dom";

// material-ui
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// project imports
import MainCard from "components/cards/MainCard";

// assets
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

export default function CreateUser() {
    const navigate = useNavigate();

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
                                <Select defaultValue="" displayEmpty>
                                    <MenuItem value="" disabled>
                                        Select Role
                                    </MenuItem>
                                    <MenuItem value={1}>Super Admin</MenuItem>
                                    <MenuItem value={2}>Admin</MenuItem>
                                    <MenuItem value={3}>Data Entry</MenuItem>
                                    <MenuItem value={4}>Verifier</MenuItem>
                                    <MenuItem value={5}>Booth Officer</MenuItem>
                                    <MenuItem value={6}>Report Viewer</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <Select defaultValue="" displayEmpty>
                                    <MenuItem value="" disabled>
                                        Select Department
                                    </MenuItem>
                                    <MenuItem value="Election Office">
                                        Election Office
                                    </MenuItem>
                                    <MenuItem value="Voter Cell">
                                        Voter Cell
                                    </MenuItem>
                                    <MenuItem value="Polling Operations">
                                        Polling Operations
                                    </MenuItem>
                                    <MenuItem value="Verification Team">
                                        Verification Team
                                    </MenuItem>
                                    <MenuItem value="Reports">Reports</MenuItem>
                                    <MenuItem value="Access Management">
                                        Access Management
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <Select defaultValue="Active">
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Inactive">
                                        Inactive
                                    </MenuItem>
                                </Select>
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
                            startIcon={<SaveOutlined />}
                            sx={{
                                bgcolor: "#103c5c",
                                "&:hover": { bgcolor: "#0c314b" },
                            }}
                        >
                            Save User
                        </Button>
                    </Stack>
                </MainCard>
            </Box>
        </Stack>
    );
}
