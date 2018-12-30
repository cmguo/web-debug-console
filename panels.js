// panels.js

var blankPanel = {
    title: '欢迎',
    html: '<div style="text-align:center;font-size: 50px"><p>Welcome</p><p>Guy!!</p></div>'
};

var panels = {
    endpoint: EndpointPanel, 
    log: LogPanel,
    trace: TracePanel,
    status: StatusPanel,
    trace: TracePanel,
    ntrace: NTracePanel,
    jtrace: JTracePanel,
    files: FilesPanel,
    fdesc: FdescPanel,
    mmap: MmapPanel,
    stone: StonePanel,
    screen: ScreenPanel,
    command: CommandPanel,
    package: PackagePanel,
    text: TextPanel,
    image: ImagePanel,
    video: VideoPanel,
    config: ConfigPanel,

    getType: function(name) {
        name = name.substring(name.lastIndexOf("/") + 1);
        if (name.endsWith(".zip")) {
            return "[zip]";
        } else if (name.endsWith(".rar")) {
            return "[rar]";
        } else if (name.startsWith("traces.")) {
            return "jtrace";
        } else if (name.startsWith("tombstone")) {
            return "stone";
        } else if (name.endsWith("maps")) {
            return "mmap";
        } else if (name.endsWith(".mp4")
            || name.endsWith(".mp3")
            || name.endsWith(".wav")
            || name.endsWith(".ogg")) {
                return "video";
        } else if (name.endsWith(".jpg")
            || name.endsWith(".png")) {
            return "image";
        } else if (/\.log/.test(name)) {
            return "log";
        } else {
            return "binary";
        }
    }

}



// This is the main content center region that will contain each example layout panel.
// It will be implemented as a CardLayout since it will contain multiple panels with
// only one being visible at any given time.
var contentPanel = new Ext.TabPanel({
    id: 'content-panel',
    region: 'center', // this is what makes this panel into a region within the containing layout
    margins: '2 5 5 0',
    activeItem: 0,
    deferredRender: true, 
    items: [
        blankPanel,  
    ]
});
