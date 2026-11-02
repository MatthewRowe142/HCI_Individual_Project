import Folder from "@mui/icons-material/Folder";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import FileTable, { type TableProps } from "../FileTable";

export default function BaseView(p: TableProps) {
  return (
    <FileTable
      {...p}
      renderIcon={(n) =>
        n.isDir ? (
          <Folder sx={{ color: "#F6C74F", fontSize: 22 }} />
        ) : (
          <InsertDriveFileOutlined sx={{ color: "#6b7280", fontSize: 20 }} />
        )
      }
    />
  );
}
