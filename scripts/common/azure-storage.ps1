$Global:workingDir = (Resolve-Path .).Path;
. "$($Global:workingDir)\common\read-config.ps1";

function getStorageContext() {
    # Create Azure Storage context
    Write-Host "Creating Azure storage context for accessing storage account $($config.storageAccountName)...";
    $storageContext = New-AzStorageContext -StorageAccountName $config.storageAccountName -UseConnectedAccount -ErrorAction Stop;
    return $storageContext;
}


function getPathRelativeToBase($fullPath, $basePath) {
    $p1 = $basePath.TrimEnd('\') + '\'; # make sure that the base path ends with /
    $p2 = $fullPath;
    $u1 = New-Object -TypeName Uri -ArgumentList $p1;
    $u2 = New-Object -TypeName Uri -ArgumentList $p2;
    $u3 = $u1.MakeRelativeUri($u2);
    return $u3.ToString().Replace('/', '\');
}

function uploadFileToStorageAccount($storageContext, $containerName, $filePath, $blobName) {
    Set-AzStorageBlobContent -Context $storageContext -Container $containerName -File $filePath -Blob $blobName -Force -ErrorAction Stop;
}

function uploadFolderToStorageAccount($storageContext, $containerName, $folderPath, $basePath) {
    $fullFolderPath = (Resolve-Path $folderPath).Path;
    $childItems = Get-ChildItem -Path $fullFolderPath;
    foreach ($childItem in $childItems) {
        if ($childItem.PSIsContainer) {
            uploadFolderToStorageAccount $storageContext $containerName $childItem.FullName $basePath;
        } else {
            $blobName = getPathRelativeToBase $childItem.FullName $basePath;
            Write-Host $blobName;
            uploadFileToStorageAccount $storageContext '$web' $childItem.FullName $blobName;
        }
    }
}
