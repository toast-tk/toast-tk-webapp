import { ActiveUIView } from "../view/interface";
import { Ng1ViewConfig } from "./viewsBuilder";
/** @hidden */
export declare type UIViewData = {
    $cfg: Ng1ViewConfig;
    $uiView: ActiveUIView;
    $animEnter: Promise<any>;
    $animLeave: Promise<any>;
    $$animLeave: {
        resolve();
    };
};
