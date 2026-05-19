import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Permission {
  id: number;
  name: string;
  description?: string;
}

interface PermissionCheckboxGroupProps {
  module: string;
  permissions: Permission[];
  assignedIds: number[];
  onToggle: (permissionId: number) => void;
}

export function PermissionCheckboxGroup({
  module,
  permissions,
  assignedIds,
  onToggle,
}: PermissionCheckboxGroupProps) {
  return (
    <div className="space-y-3 border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-foreground">{module}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {permissions.map((permission) => {
          const isAssigned = assignedIds.includes(permission.id);
          return (
            <div
              key={permission.id}
              className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`permission-${permission.id}`}
                checked={isAssigned}
                onCheckedChange={() => onToggle(permission.id)}
                className="mt-1"
              />
              <Label
                htmlFor={`permission-${permission.id}`}
                className="cursor-pointer flex-1 font-normal"
              >
                {permission.name}
                {permission.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {permission.description}
                  </p>
                )}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
