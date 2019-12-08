$Global:workingDir = (Resolve-Path .).Path;
. "$($Global:workingDir)\common\read-config.ps1";
. "$($Global:workingDir)\common\connect-azure.ps1";
. "$($Global:workingDir)\common\azure-storage.ps1";

try {
    readConfig;

    # Connect to Azure tenant
    $Global:result = connectToAzure;
    if ($result -ne 0) {
        Write-Error "connectToAzure returned error code $result, processing stopped";
        exit;
    }


    $storageContext = getStorageContext;

    #$files = Get-ChildItem -Path "$Global:workingDir\..\public";
    #foreach ($file in $files) {
    #    uploadFileToStorageAccount $storageContext '$web' $file.FullName;
    #}
    $fullBuildFolderPath = (Resolve-Path "$($Global:workingDir)\..\build").Path;
    uploadFolderToStorageAccount $storageContext '$web' $fullBuildFolderPath $fullBuildFolderPath;
} catch {
    Write-Error $_;
}

